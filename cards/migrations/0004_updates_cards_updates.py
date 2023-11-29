# Generated by Django 4.2.4 on 2023-11-14 05:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cards', '0003_cards_position'),
    ]

    operations = [
        migrations.CreateModel(
            name='Updates',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('detail', models.TextField()),
                ('date_updated', models.TextField()),
            ],
        ),
        migrations.AddField(
            model_name='cards',
            name='updates',
            field=models.ManyToManyField(related_name='card_updates', to='cards.updates'),
        ),
    ]
